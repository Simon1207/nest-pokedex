import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { isValidObjectId, Model } from 'mongoose';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';

@Injectable()
export class PokemonService {
  constructor(
    @InjectModel(  Pokemon.name )
    private readonly pokemonModel: Model <Pokemon>,
  ) {
    
  }

  async create(createPokemonDto: CreatePokemonDto) {
    //convierto todo a minuscula
    createPokemonDto.name = createPokemonDto.name.toLocaleLowerCase();

    try {
        //insersion en DB
        const pokemon = await this.pokemonModel.create( createPokemonDto );
        //retorno el pokemon que inserte
        return pokemon;
    } catch (error) {
      this.handleExceptions( error );
        
      console.log(error);
      throw new InternalServerErrorException(`can't create pokemon`);
    }
    
  }

  findAll() {
    return `This action returns all pokemon`;
  }

   async findOne(term: string) {
    //ojo: id es el parametro que se manda para buscar, puede ser no, mongoID o el nombre del pokemon
      let pokemon: Pokemon;

      //si es un numero, BUSCO POR nO
      if( !isNaN(+term) ) {
        //busco en la base de datos la columna "no"
        pokemon = await this.pokemonModel.findOne({  no: term });
        }
        //Si es un MongoID busco por MongoId
        if ( !pokemon && isValidObjectId( term ) ) {
          pokemon = await this.pokemonModel.findById( term );
        }

        //Si es un nombre, busca por Name
        if ( !pokemon ) {
          pokemon = await this.pokemonModel.findOne({  name: term.toLocaleLowerCase().trim() })
        }
        //si el pokemon no existe
        if( !pokemon ) throw new NotFoundException(`Pokemon with id, name or no ${ term } not found`);
     
      return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    
    const pokemon = await this.findOne( term );
    //valido que exista el name en la base de datos, si viene va a estar en minuscula
    if( updatePokemonDto.name )
        updatePokemonDto.name = updatePokemonDto.name.toLocaleLowerCase();

        try {
          //grabamos en DB
        await pokemon.updateOne( updatePokemonDto );
          //retornamos el resultado
        return { ...pokemon.toJSON(), ...UpdatePokemonDto  };
        } catch( error ) {
          this.handleExceptions( error );
        } 

      
  }

  async remove(id: string) {
    //  const result = await this.pokemonModel.findByIdAndDelete(  id  );
  
    const { deletedCount } = await this.pokemonModel.deleteOne({_id: id});
    if(  deletedCount ===0 )
      throw new BadRequestException(`Pokemon with id "${ id }" not found `);

    return;
  }

  private handleExceptions( error: any) {
    if( error.code ===11000){
      throw new BadRequestException(`Pokemon exist in the DB ${JSON.stringify(error.keyValue)}`);
    }
  }
}
